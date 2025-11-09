import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import QRCode from "https://esm.sh/qrcode@1.5.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  email: string;
  fullName: string;
  verificationToken: string;
  qrSecret: string;
  redirectUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    
    if (!sendgridApiKey) {
      console.log("SENDGRID_API_KEY not configured - email functionality disabled");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured. Please add SENDGRID_API_KEY to continue." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, fullName, verificationToken, qrSecret, redirectUrl }: VerificationRequest & { redirectUrl?: string } = await req.json();

    console.log("📧 Preparing email for:", email);

    // Get user ID from email
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.users.find((u: any) => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Create verification link
    const appUrl = redirectUrl || Deno.env.get('SUPABASE_URL') || 'https://vaultbankonline.com';
    const verificationLink = `${appUrl}/api/verify-email?token=${qrSecret}&userId=${user.id}`;

    console.log("✅ Verification link generated");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background-color: #2563eb;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to VaultBank</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hello ${fullName},
                      </p>
                       <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                         Thank you for submitting your application to VaultBank. Please verify your email address to continue.
                       </p>
                       <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                         Click the button below to verify your email address:
                       </p>
                       <div style="text-align: center; margin: 0 0 30px;">
                         <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                           Verify Email Address
                         </a>
                       </div>
                       <p style="margin: 0 0 16px; color: #333333; font-size: 16px; line-height: 1.6;">
                         Or enter this verification code manually:
                       </p>
                       <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 0 0 24px; text-align: center;">
                         <p style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                           ${qrSecret}
                         </p>
                       </div>
                       <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                         Once verified, your application will be reviewed by our team for approval.
                       </p>
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        <strong>Important:</strong> You will receive another email once your account has been approved and is ready to use.
                      </p>
                      <p style="margin: 0 0 8px; color: #666666; font-size: 14px; line-height: 1.6;">
                        If you did not request this, please contact our support team immediately.
                      </p>
                      <p style="margin: 24px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Thank you,<br>
                        VaultBank Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                        VaultBank Financial<br>
                        806 E Exchange St, Brodhead, WI 53520
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Convert HTML to plain text for better deliverability
    const plainText = emailHtml
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Send email using SendGrid API with anti-spam features
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: "VaultBank - Email Verification Required"
        }],
        from: {
          email: "info@vaulteonline.com",
          name: "VaultBank"
        },
        reply_to: {
          email: "support@vaultbankonline.com",
          name: "VaultBank Support Team"
        },
        content: [
          {
            type: "text/plain",
            value: plainText
          },
          {
            type: "text/html",
            value: emailHtml
          }
        ],
        tracking_settings: {
          click_tracking: {
            enable: true,
            enable_text: false
          },
          open_tracking: {
            enable: true
          },
          subscription_tracking: {
            enable: false
          }
        },
        mail_settings: {
          bypass_list_management: {
            enable: false
          },
          footer: {
            enable: false
          },
          sandbox_mode: {
            enable: false
          }
        },
        categories: ["account-verification", "security"],
        custom_args: {
          security_type: "email_verification",
          verification_version: "v2"
        }
      })
    });

    // Log the complete response for debugging
    const responseBody = await emailResponse.text();
    console.log("SendGrid Response Status:", emailResponse.status);
    console.log("SendGrid Response Headers:", Object.fromEntries(emailResponse.headers.entries()));
    console.log("SendGrid Response Body:", responseBody);

    if (!emailResponse.ok) {
      console.error("SendGrid API error - Full response:", responseBody);
      throw new Error(`SendGrid API error: ${emailResponse.status} - ${responseBody}`);
    }

    // SendGrid returns 202 Accepted - this means it accepted the request, not that it delivered
    console.log("✅ SendGrid accepted email request (Status: 202)");
    console.log("📧 Email sent to:", email);
    console.log("⚠️ Note: Check SendGrid Activity Feed if email doesn't arrive");

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
