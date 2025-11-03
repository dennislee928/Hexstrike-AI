export default function BinaryToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Binary Analysis Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Advanced tools for binary analysis, reverse engineering, and exploitation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ToolCard 
            name="Ghidra"
            description="NSA's open-source reverse engineering tool"
            href="/tools/binary/ghidra"
          />
          <ToolCard 
            name="GDB"
            description="GNU Debugger for binary analysis"
            href="/tools/binary/gdb"
          />
          <ToolCard 
            name="radare2"
            description="Advanced reverse engineering framework"
            href="/tools/binary/radare2"
          />
          <ToolCard 
            name="pwntools"
            description="CTF framework and exploit development"
            href="/tools/binary/pwntools"
          />
          <ToolCard 
            name="ROPgadget"
            description="ROP gadget finder and automatic ROP chain generator"
            href="/tools/binary/ropgadget"
          />
          <ToolCard 
            name="angr"
            description="Binary analysis framework"
            href="/tools/binary/angr"
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

