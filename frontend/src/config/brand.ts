export const brand = {
  name: "SJTU选课社区",
  shortName: "选课社区",
  description: "搜索上海交通大学的课程与教师，查看和分享真实的课程点评。",
  feedbackEmail: "course@sjtu.plus",
} as const

export function formatPageTitle(pageTitle?: string) {
  return pageTitle ? `${pageTitle} - ${brand.name}` : brand.name
}
