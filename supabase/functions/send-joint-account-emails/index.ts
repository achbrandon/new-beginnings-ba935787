import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JointAccountEmailRequest {
  accountHolderEmail: string;
  accountHolderName: string;
  partnerEmail: string;
  partnerName: string;
  accountNumber: string;
  accountBalance: number;
  requiredDeposit: number;
  accountType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      accountHolderEmail,
      accountHolderName,
      partnerEmail,
      partnerName,
      accountNumber,
      accountBalance,
      requiredDeposit,
      accountType,
    }: JointAccountEmailRequest = await req.json();

    console.log("Sending joint account emails...");

    // Email to Account Holder using Resend API directly
    const holderEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "VaultBank <onboarding@resend.dev>",
        to: [accountHolderEmail],
        subject: "Joint Account Holder Request - Action Required",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
              .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .terms { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .terms h3 { color: #667eea; margin-top: 0; }
              .terms ul { padding-left: 20px; }
              .terms li { margin: 10px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Joint Account Holder Request</h1>
                <p>Confirmation of Your Request</p>
              </div>
              <div class="content">
                <p>Dear ${accountHolderName},</p>
                
                <p>This letter confirms that you have successfully submitted a request to add a joint account holder to your ${accountType} account.</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0; color: #667eea;">Account Details</h3>
                  <p><strong>Account Number:</strong> ****${accountNumber.slice(-4)}</p>
                  <p><strong>Account Type:</strong> ${accountType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Current Balance:</strong> $${accountBalance.toFixed(2)}</p>
                  <p><strong>Joint Holder Name:</strong> ${partnerName}</p>
                  <p><strong>Joint Holder Email:</strong> ${partnerEmail}</p>
                </div>

                <div class="warning-box">
                  <h3 style="margin-top: 0;">⚠️ Important Information</h3>
                  <p><strong>Required Partner Deposit:</strong> $${requiredDeposit.toFixed(2)} (0.9% of account balance)</p>
                  <p>Your partner must deposit this amount before the joint account becomes active.</p>
                </div>

                <div class="terms">
                  <h3>Joint Account Terms & Conditions</h3>
                  <p>By proceeding with this joint account, both parties agree to the following terms:</p>
                  
                  <ul>
                    <li><strong>Equal Rights:</strong> Both account holders will have equal rights to the account, including the ability to deposit, withdraw, and view all transactions.</li>
                    
                    <li><strong>Transfer Restrictions:</strong> Direct transfers between joint account holders are strictly prohibited. All transfers must be made to external accounts only.</li>
                    
                    <li><strong>Shared Responsibility:</strong> Both account holders are jointly and severally responsible for any overdrafts, fees, or obligations associated with this account.</li>
                    
                    <li><strong>Account Management:</strong> Either account holder may close the account, but both must agree to major changes such as account type modifications.</li>
                    
                    <li><strong>Liability:</strong> Each account holder is fully liable for all transactions made by either party on this account.</li>
                    
                    <li><strong>Documentation:</strong> Both parties must maintain proper identification and contact information on file with the bank.</li>
                    
                    <li><strong>Dispute Resolution:</strong> Any disputes between joint account holders must be resolved between the parties. The bank is not responsible for mediating disputes.</li>
                    
                    <li><strong>Account Termination:</strong> Upon termination, remaining funds will be distributed equally unless otherwise specified in writing by both parties.</li>
                  </ul>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #667eea;">Next Steps</h3>
                  <ol>
                    <li>Admin will review your request within 1-2 business days</li>
                    <li>${partnerName} will receive an email with deposit instructions</li>
                    <li>Once the deposit is confirmed, the joint account will be activated</li>
                    <li>Both parties will receive final confirmation emails</li>
                  </ol>
                </div>

                <p><strong>Important Notice:</strong> This joint account arrangement is subject to our standard banking terms and conditions, which are available on our website or by request.</p>

                <p>If you have any questions or need to cancel this request, please contact our customer support immediately.</p>

                <div class="footer">
                  <p><strong>VaultBank</strong></p>
                  <p>806 E Exchange St, Brodhead, WI 53520-0108, US</p>
                  <p>This is an automated message. Please do not reply to this email.</p>
                  <p>&copy; ${new Date().getFullYear()} VaultBank. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      }),
    });

    if (!holderEmailResponse.ok) {
      throw new Error(`Failed to send email to account holder: ${await holderEmailResponse.text()}`);
    }

    const holderEmailData = await holderEmailResponse.json();
    console.log("Account holder email sent:", holderEmailData);

    // Email to Partner (Beneficiary) using Resend API directly
    const partnerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "VaultBank <onboarding@resend.dev>",
        to: [partnerEmail],
        subject: "You've Been Added as Joint Account Holder - Action Required",
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .highlight-box { background: #667eea; color: white; padding: 25px; text-align: center; margin: 20px 0; border-radius: 10px; }
              .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
              .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .terms { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .terms h3 { color: #667eea; margin-top: 0; }
              .terms ul { padding-left: 20px; }
              .terms li { margin: 10px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome as Joint Account Holder!</h1>
                <p>You've Been Invited to Join an Account</p>
              </div>
              <div class="content">
                <p>Dear ${partnerName},</p>
                
                <p>You have been added as a joint account holder by <strong>${accountHolderName}</strong> on their ${accountType} account at VaultBank.</p>
                
                <div class="highlight-box">
                  <h2 style="margin-top: 0;">Required Deposit</h2>
                  <h1 style="margin: 10px 0; font-size: 48px;">$${requiredDeposit.toFixed(2)}</h1>
                  <p style="margin-bottom: 0;">You must deposit this amount (0.9% of account balance) to activate your joint account access</p>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #667eea;">Account Information</h3>
                  <p><strong>Primary Account Holder:</strong> ${accountHolderName}</p>
                  <p><strong>Account Type:</strong> ${accountType.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Account Number:</strong> ****${accountNumber.slice(-4)}</p>
                  <p><strong>Current Total Balance:</strong> $${accountBalance.toFixed(2)}</p>
                </div>

                <div class="terms">
                  <h3>Your Rights & Responsibilities</h3>
                  <p>As a joint account holder, you will have:</p>
                  
                  <h4 style="color: #667eea; margin-top: 20px;">✓ Your Rights:</h4>
                  <ul>
                    <li>Full access to view all account transactions and statements</li>
                    <li>Ability to deposit funds into the account</li>
                    <li>Ability to withdraw funds from the account</li>
                    <li>Equal decision-making authority on account matters</li>
                    <li>Receive account notifications and alerts</li>
                  </ul>

                  <h4 style="color: #ffc107; margin-top: 20px;">⚠️ Important Restrictions:</h4>
                  <ul>
                    <li><strong>NO direct transfers between joint holders:</strong> You cannot transfer money directly to or from ${accountHolderName}'s other accounts</li>
                    <li>All transfers must be made to external bank accounts only</li>
                    <li>This restriction is permanent and cannot be changed</li>
                  </ul>

                  <h4 style="color: #667eea; margin-top: 20px;">📋 Your Responsibilities:</h4>
                  <ul>
                    <li>You are fully liable for all account transactions, including those made by ${accountHolderName}</li>
                    <li>You must maintain sufficient funds to cover any overdrafts</li>
                    <li>You are responsible for all fees associated with the account</li>
                    <li>You must keep your contact information current with the bank</li>
                    <li>You must comply with all banking regulations and policies</li>
                  </ul>
                </div>

                <div class="warning-box">
                  <h3 style="margin-top: 0;">⚠️ Critical Information</h3>
                  <p><strong>Joint and Several Liability:</strong> Both you and ${accountHolderName} are individually and jointly responsible for all account obligations. This means the bank can pursue either or both of you for any debts or obligations.</p>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0; color: #667eea;">How to Complete Your Setup</h3>
                  <ol>
                    <li><strong>Wait for Admin Approval:</strong> Your request is currently under review (1-2 business days)</li>
                    <li><strong>Receive Confirmation:</strong> You'll get an email once approved with deposit instructions</li>
                    <li><strong>Make Your Deposit:</strong> Deposit exactly $${requiredDeposit.toFixed(2)} to activate your access</li>
                    <li><strong>Account Activation:</strong> Once your deposit is confirmed, you'll receive login credentials</li>
                  </ol>
                </div>

                <div class="terms">
                  <h3>Terms & Conditions Agreement</h3>
                  <p>By proceeding with this joint account, you acknowledge and agree to:</p>
                  <ul>
                    <li>All terms outlined in this email</li>
                    <li>VaultBank's standard account terms and conditions</li>
                    <li>The transfer restrictions between joint holders</li>
                    <li>Your shared liability for all account obligations</li>
                    <li>The requirement to maintain proper identification on file</li>
                  </ul>
                  <p><strong>Note:</strong> Full terms and conditions are available on our website or by request from customer support.</p>
                </div>

                <p><strong>Questions or Concerns?</strong> If you did not request to be added to this account or have any questions, please contact our customer support team immediately.</p>

                <div class="footer">
                  <p><strong>VaultBank</strong></p>
                  <p>806 E Exchange St, Brodhead, WI 53520-0108, US</p>
                  <p>Customer Support: Available 24/7</p>
                  <p>This is an automated message. Please do not reply to this email.</p>
                  <p>&copy; ${new Date().getFullYear()} VaultBank. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      }),
    });

    if (!partnerEmailResponse.ok) {
      throw new Error(`Failed to send email to partner: ${await partnerEmailResponse.text()}`);
    }

    const partnerEmailData = await partnerEmailResponse.json();
    console.log("Partner email sent:", partnerEmailData);

    return new Response(
      JSON.stringify({
        success: true,
        holderEmailId: holderEmailData.id,
        partnerEmailId: partnerEmailData.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending joint account emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
