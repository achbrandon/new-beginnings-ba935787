import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  DollarSign, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Bitcoin,
  CreditCard,
  Smartphone,
  Banknote
} from "lucide-react";

export const JointAccountFlowDiagram = () => {
  const steps = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Submit Request",
      description: "Fill out joint account application with partner details"
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "1% Security Deposit",
      description: "Deposit 1% of account balance for identity verification",
      paymentMethods: [
        { icon: <CreditCard className="h-4 w-4" />, label: "ACH Transfer" },
        { icon: <Bitcoin className="h-4 w-4" />, label: "Bitcoin (Cash App)" },
        { icon: <Smartphone className="h-4 w-4" />, label: "PayPal/Zelle/Venmo" }
      ]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "OTP Verification",
      description: "Verify identity with one-time password"
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Admin Approval",
      description: "Wait for account review and approval"
    },
    {
      icon: <Banknote className="h-8 w-8" />,
      title: "Full Access",
      description: "Unlimited withdrawals to private account and linked payment methods",
      benefits: [
        "Instant withdrawals to Cash App",
        "Transfer to PayPal/Zelle/Venmo",
        "Withdraw to private account",
        "Pre-verified payment methods"
      ]
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl">Joint Account Process</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop View */}
        <div className="hidden lg:flex items-start justify-between gap-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4 flex-1">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  
                  {step.paymentMethods && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-xs font-medium text-foreground">Methods:</p>
                      {step.paymentMethods.map((method, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
                          {method.icon}
                          <span>{method.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {step.benefits && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-xs font-medium text-foreground">Benefits:</p>
                      {step.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
                          <CheckCircle className="h-3 w-3" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <ArrowRight className="h-6 w-6 text-muted-foreground mt-5 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  
                  {step.paymentMethods && (
                    <div className="space-y-1.5 mt-3">
                      <p className="text-xs font-medium text-foreground">Payment Methods:</p>
                      {step.paymentMethods.map((method, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {method.icon}
                          <span>{method.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {step.benefits && (
                    <div className="space-y-1.5 mt-3">
                      <p className="text-xs font-medium text-foreground">Benefits:</p>
                      {step.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Why 1% Deposit Information */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Why is the 1% security deposit required?
          </h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              <span><strong>Enhanced Security:</strong> Validates partner identity and commitment to the joint account</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              <span><strong>Compliance:</strong> Creates an audit trail for regulatory requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              <span><strong>Easy Verification:</strong> Payment method used for deposit becomes pre-verified for instant withdrawals</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
              <span><strong>Smart Linking:</strong> Deposit via Cash App? It's automatically linked for future Bitcoin or instant transfers</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
