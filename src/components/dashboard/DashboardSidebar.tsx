import {
  Home,
  CreditCard,
  ArrowLeftRight,
  FileText,
  Smartphone,
  Settings,
  TrendingUp,
  Bell,
  Award,
  DollarSign,
  FileBarChart,
  Briefcase,
  Gift,
  LifeBuoy,
  Wallet,
  Bitcoin,
  Link,
  Download,
  BarChart3,
  Shield,
  Users,
  Link2,
  History,
  Scale,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  onOpenSupport?: () => void;
}

const menuItems = [
  { title: "Overview", url: "/bank/dashboard", icon: Home },
  { title: "Transaction History", url: "/bank/dashboard/transaction-history", icon: History },
  { title: "Accounts", url: "/bank/dashboard/accounts", icon: Wallet },
  { title: "Account Details", url: "/bank/dashboard/account-details", icon: FileText },
  { title: "Joint Account Status", url: "/bank/dashboard/joint-account-status", icon: Users },
  { title: "Compliance Case", url: "/bank/dashboard/compliance", icon: Scale },
  { title: "Linked Payment Accounts", url: "/bank/dashboard/linked-accounts", icon: Link2 },
  { title: "Analytics", url: "/bank/dashboard/analytics", icon: BarChart3 },
  { title: "Transfers", url: "/bank/dashboard/transfers", icon: ArrowLeftRight },
  { title: "Bill Pay", url: "/bank/dashboard/bill-pay", icon: FileText },
  { title: "Mobile Deposit", url: "/bank/dashboard/mobile-deposit", icon: Smartphone },
  { title: "ACH Accounts", url: "/bank/dashboard/ach-accounts", icon: Link },
  { title: "Crypto Wallet", url: "/bank/dashboard/crypto", icon: Bitcoin },
  { title: "Apply for Card", url: "/bank/dashboard/card-application", icon: CreditCard },
  { title: "Cards", url: "/bank/dashboard/cards", icon: CreditCard },
  { title: "Credit Score", url: "/bank/dashboard/credit-score", icon: TrendingUp },
  { title: "Loans", url: "/bank/dashboard/loans", icon: DollarSign },
  { title: "Statements", url: "/bank/dashboard/statements", icon: FileBarChart },
  { title: "Generate Statement", url: "/bank/dashboard/generate-statement", icon: Download },
  { title: "Offers & Rewards", url: "/bank/dashboard/offers", icon: Gift },
  { title: "Alerts", url: "/bank/dashboard/alerts", icon: Bell },
  { title: "Login History", url: "/bank/dashboard/login-history", icon: Shield },
  { title: "Settings", url: "/bank/dashboard/settings", icon: Settings },
];

// Dashboard sidebar navigation component

export function DashboardSidebar({ onOpenSupport }: DashboardSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Banking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/bank/dashboard"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenSupport}>
                  <LifeBuoy className="h-4 w-4" />
                  {open && <span>Support</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
