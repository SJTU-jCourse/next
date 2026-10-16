export const ACCESS_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "a",
  "s",
  "f",
  "j",
  "k",
  "l",
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
]

export const SHORTCUT_ROOT_SELECTOR = "[data-shortcut-root]"
export const SEARCH_TARGET_SELECTOR = "[data-shortcut-target='site-search']"

export type PageShortcut = {
  keys: string
  title: string
  description: string
  path:
    | "/"
    | "/course"
    | "/teacher"
    | "/review"
    | "/course/hot"
    | "/review/followed"
    | "/review/mine"
    | "/course/mine"
    | "/point"
    | "/api-key"
    | "/admin/site-stat"
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

export type ActionShortcut = {
  keys: string
  title: string
  description: string
}

export type AccessHint = {
  key: string
  label: string
  element: HTMLElement
  rect: DOMRect
}

export const pageShortcuts: PageShortcut[] = [
  { keys: "G H", title: "首页", description: "回到首页", path: "/" },
  {
    keys: "G C",
    title: "课程",
    description: "浏览和搜索课程",
    path: "/course",
  },
  {
    keys: "G T",
    title: "教师",
    description: "浏览和搜索教师",
    path: "/teacher",
  },
  { keys: "G R", title: "点评", description: "查看公开点评", path: "/review" },
  {
    keys: "G O",
    title: "热门课程",
    description: "查看热门课程",
    path: "/course/hot",
  },
  {
    keys: "G F",
    title: "关注动态",
    description: "查看关注课程的新点评",
    path: "/review/followed",
    requiresAuth: true,
  },
  {
    keys: "G M",
    title: "我的点评",
    description: "查看我发布的点评",
    path: "/review/mine",
    requiresAuth: true,
  },
  {
    keys: "G U",
    title: "我的课程",
    description: "查看选课记录与关注的课程",
    path: "/course/mine",
    requiresAuth: true,
  },
  {
    keys: "G P",
    title: "我的积分",
    description: "查看积分记录",
    path: "/point",
    requiresAuth: true,
  },
  {
    keys: "G K",
    title: "API Key",
    description: "管理 API Key",
    path: "/api-key",
    requiresAuth: true,
  },
  {
    keys: "G A",
    title: "站点统计",
    description: "查看站点统计数据",
    path: "/admin/site-stat",
    requiresAdmin: true,
  },
]

export const actionShortcuts: ActionShortcut[] = [
  { keys: "/", title: "搜索", description: "打开顶部搜索框" },
  {
    keys: ".",
    title: "页面控件",
    description: "给当前可见按钮、链接和输入框显示编号",
  },
  { keys: "?", title: "快捷键提示", description: "打开或关闭此提示" },
  { keys: "Esc", title: "退出", description: "关闭提示或退出页面控件模式" },
]
