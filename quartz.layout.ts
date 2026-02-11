import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer({
      folderClickBehavior: "collapse",
      folderDefaultState: "open",
      filterFn: (node) => {
        // Hide the Archive folder
        if (node.isFolder && node.displayName === "Archive") return false

        // Hide date-formatted pages (DD-MM-YYYY pattern)
        if (!node.isFolder && /^\d{2}-\d{2}-\d{4}$/.test(node.displayName)) return false

        return true
      },
      sortFn: (a, b) => {
        // Define custom order for main files
        const order = ["Now", "Health", "Projects", "Archives"]
        const aIndex = order.indexOf(a.displayName)
        const bIndex = order.indexOf(b.displayName)

        // If both are in the custom order list, sort by that
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        // If only one is in the list, it comes first
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        // Otherwise, alphabetical
        return a.displayName.localeCompare(b.displayName)
      },
    })),
  ],
  right: [],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
  ],
  right: [],
}
