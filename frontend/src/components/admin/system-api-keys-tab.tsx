import { useState } from "react"
import { RiAddLine } from "@remixicon/react"
import { ApiKeyCreateDialog } from "@/components/api-key/api-key-create-dialog"
import { ApiKeyTable } from "@/components/api-key/api-key-table"
import { Button } from "@/components/ui/button"
import {
  useCreateSystemApiKey,
  useDeleteSystemApiKey,
  useSystemApiKeys,
} from "@/hooks/use-api-key"
import { getErrorMessage } from "./admin-utils"
import { SectionHeader } from "@/components/common/page-header"

export function SystemApiKeysTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const systemKeysQuery = useSystemApiKeys()
  const createMutation = useCreateSystemApiKey()
  const deleteMutation = useDeleteSystemApiKey()

  return (
    <section className="space-y-4">
      <SectionHeader
        title="系统 API Key"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <RiAddLine data-icon="inline-start" />
            新建系统 API Key
          </Button>
        }
      />

      <ApiKeyCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={(cmd) => createMutation.mutateAsync(cmd)}
        isCreating={createMutation.isPending}
        title="新建系统 API Key"
        description="创建成功后，完整的 API Key 仅显示一次，请妥善保存。"
        nameInputID="system-api-key-name"
        namePlaceholder="例如：外部积分查询服务"
        getErrorMessage={getErrorMessage}
      />

      <ApiKeyTable
        apiKeys={systemKeysQuery.data ?? []}
        isLoading={systemKeysQuery.isLoading}
        isDeleting={deleteMutation.isPending}
        emptyText="暂无系统 API Key"
        deleteAriaLabel="删除系统 API Key"
        deleteDialogTitle="删除系统 API Key？"
        deleteDialogDescription="删除后，使用该 API Key 的请求会立即失效。"
        deleteActionLabel="删除"
        onDelete={(id) => deleteMutation.mutateAsync(id)}
        getDeleteErrorMessage={getErrorMessage}
      />
    </section>
  )
}
