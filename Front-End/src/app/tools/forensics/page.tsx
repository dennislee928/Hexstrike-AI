export default function ForensicsToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Digital Forensics Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Tools for digital forensics, data recovery, and steganography analysis.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ToolCard 
            name="Volatility"
            description="Memory forensics framework"
            href="/tools/forensics/volatility"
          />
          <ToolCard 
            name="Volatility3"
            description="Next-gen memory forensics"
            href="/tools/forensics/volatility3"
          />
          <ToolCard 
            name="Foremost"
            description="File recovery tool"
            href="/tools/forensics/foremost"
          />
          <ToolCard 
            name="Steghide"
            description="Steganography detection and extraction"
            href="/tools/forensics/steghide"
          />
          <ToolCard 
            name="ExifTool"
            description="Metadata reader and writer"
            href="/tools/forensics/exiftool"
          />
          <ToolCard 
            name="Hashpump"
            description="Hash length extension attack tool"
            href="/tools/forensics/hashpump"
          />
        </div>
      </div>
    </div>
  )
}

function ToolCard({ name, description, href }: { name: string; description: string; href: string }) {
  return (
    <a 
      href={href}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
    >
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {name}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        {description}
      </p>
    </a>
  )
}

