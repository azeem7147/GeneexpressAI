import "./globals.css";

export const metadata = {
  title: "GeneExpressAI - Oncology Radiogenomics Platform",
  description: "Next-Generation Multimodal Neuroimaging & Whole-Transcriptome Precision Oncology Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
