import { Button } from "@/components/ui/button"
import { PageHeader, SectionHeader } from "@/components/common/page-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { brand } from "@/config/brand"

const agreementSections = [
  {
    title: "机制",
    paragraphs: [
      <>
        选课社区采用 jAccount 或邮箱登录并作为身份标识。本站不明文存储您的
        jAccount 用户名，仅在数据库中存放其哈希值。
      </>,
      <>选课社区前台不显示每条点评的用户名，也不显示不同点评之间的用户关联。</>,
    ],
  },
  {
    title: "点评管理",
    paragraphs: [
      <>
        在符合社区规范的情况下，我们不修改选课社区的点评内容，也不评价内容的真实性。如果您上过某一门课程并认为网站上的点评与事实不符，欢迎提交您的意见，我们相信全面的信息会给大家最好的答案。
      </>,
      <>
        选课社区管理员的责任仅限于维护系统的稳定，删除非课程点评内容和重复发帖，并维护课程和教师信息格式，方便进行数据的批量处理。
      </>,
    ],
  },
  {
    title: "隐私",
    paragraphs: [
      <>
        当您访问选课社区时，我们使用百度统计收集您的访问信息，便于统计用户使用情况。
      </>,
      <>
        当您登录选课社区时，我们会收集您的身份类型（在校生、教职工、校友等），但不收集除此以外的其他信息。
      </>,
      <>
        选课社区部分功能可能需要使用 jAccount
        接口获取并存储选课等信息，我们将在您使用此类功能前予以提示。
      </>,
    ],
  },
]

function AgreementSections({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {agreementSections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2
            className={
              compact ? "text-base font-semibold" : "text-lg font-semibold"
            }
          >
            {section.title}
          </h2>
          <div className="space-y-2 text-sm leading-7 text-muted-foreground">
            {section.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export function AboutContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={<>关于 {brand.name}</>}
        description="站点说明、用户协议与联系方式"
      />
      <p className="text-sm leading-7 text-muted-foreground">
        {brand.name}
        为非官方网站，目的在于帮助同学们更全面地了解课程，不能也不打算代替教务处的课程评教。
      </p>

      <AgreementSections />

      <section className="space-y-3">
        <SectionHeader title="联系方式" />
        <p className="text-sm leading-7 text-muted-foreground">
          您可以通过邮件{" "}
          <a
            href={`mailto:${brand.feedbackEmail}`}
            className="font-medium text-primary hover:underline"
          >
            {brand.feedbackEmail}
          </a>{" "}
          联系我们。
        </p>
      </section>
    </div>
  )
}

export function AboutAgreementExcerpt() {
  return (
    <Dialog>
      <section className="mx-auto mt-8 max-w-sm text-center text-sm leading-7 text-muted-foreground">
        登录或注册即表示您了解并接受
        <DialogTrigger asChild>
          <Button variant="link" className="h-auto px-1 py-0 align-baseline">
            用户协议与站点说明
          </Button>
        </DialogTrigger>
        。
      </section>

      <DialogContent className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-w-3xl">
        <DialogTitle className="sr-only">用户协议与站点说明</DialogTitle>
        <DialogDescription className="sr-only">
          阅读 {brand.name} 的用户协议、站点说明和隐私说明。
        </DialogDescription>
        <AboutContent />
      </DialogContent>
    </Dialog>
  )
}
