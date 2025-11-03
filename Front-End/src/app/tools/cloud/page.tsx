export default function CloudToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Cloud Security Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Security assessment tools for cloud infrastructure and containerized environments.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ToolCard 
            name="Trivy"
            description="Vulnerability scanner for containers and IaC"
            href="/tools/cloud/trivy"
          />
          <ToolCard 
            name="Prowler"
            description="AWS security assessment tool"
            href="/tools/cloud/prowler"
          />
          <ToolCard 
            name="ScoutSuite"
            description="Multi-cloud security auditing tool"
            href="/tools/cloud/scout-suite"
          />
          <ToolCard 
            name="kube-bench"
            description="Kubernetes CIS Benchmark checker"
            href="/tools/cloud/kube-bench"
          />
          <ToolCard 
            name="Checkov"
            description="Static code analysis for IaC"
            href="/tools/cloud/checkov"
          />
          <ToolCard 
            name="Falco"
            description="Cloud-native runtime security"
            href="/tools/cloud/falco"
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

