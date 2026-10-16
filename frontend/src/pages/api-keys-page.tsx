import { useState } from "react"
import { PageHeader, SectionHeader } from "@/components/common/page-header"
import { RiAddLine } from "@remixicon/react"
import { ApiKeyCreateDialog } from "@/components/api-key/api-key-create-dialog"
import { ApiKeyTable } from "@/components/api-key/api-key-table"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/use-api-key"

export function ApiKeysPage() {
  const { user } = useAuth()
  const { data: apiKeys = [], isLoading } = useApiKeys(!!user)
  const createMutation = useCreateApiKey()
  const deleteMutation = useDeleteApiKey()

  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <PageTitle>API Key</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            title="API Key"
            description="用于脚本或外部工具访问选课社区接口，请妥善保管"
          />

          <ApiKeyCreateDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreate={(cmd) => createMutation.mutateAsync(cmd)}
            isCreating={createMutation.isPending}
            title="新建 API Key"
            description="创建成功后，完整的 API Key 仅显示一次，请妥善保存。"
            nameInputID="api-key-name"
            namePlaceholder="例如：本地脚本"
          />

          <section className="space-y-4">
            <SectionHeader
              title="我的 API Key"
              actions={
                <Button onClick={() => setIsCreateOpen(true)}>
                  <RiAddLine data-icon="inline-start" />
                  新建 API Key
                </Button>
              }
            />

            <ApiKeyTable
              apiKeys={apiKeys}
              isLoading={isLoading}
              isDeleting={deleteMutation.isPending}
              emptyText="暂无 API Key"
              deleteAriaLabel="删除 API Key"
              deleteDialogTitle="删除 API Key？"
              deleteDialogDescription="删除后，使用该 API Key 的请求会立即失效。"
              deleteActionLabel="删除"
              onDelete={(id) => deleteMutation.mutateAsync(id)}
            />
          </section>
        </div>
      </PageShell>
    </>
  )
}
