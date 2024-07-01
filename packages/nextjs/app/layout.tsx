import "@rainbow-me/rainbowkit/styles.css";
import { Metadata } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : `http://localhost:${process.env.PORT}`;
const imageUrl = `${baseUrl}/thumbnail.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Baluni",
    template: "%s | Baluni",
  },
  description: "🎈 Rebalance your token ease. 🦄",
  openGraph: {
    title: {
      default: "Baluni",
      template: "%s | Baluni",
    },
    description: "🎈 Rebalance your token ease. 🦄",
    images: [
      {
        url: imageUrl,
      },
    ],
  },
  // twitter: {
  //   card: "summary_large_image",
  //   images: [imageUrl],
  //   title: {
  //     default: "Scaffold-ETH 2",
  //     template: "%s | Scaffold-ETH 2",
  //   },
  //   description: "Built with 🏗 Scaffold-ETH 2",
  // },
  icons: {
    icon: [{ url: "/favicon.webp", sizes: "32x32", type: "image/png" }],
  },
};

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
