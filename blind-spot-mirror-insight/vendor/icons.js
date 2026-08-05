import createElement from "./lucide/createElement.js";
import ArrowUpRight from "./lucide/icons/arrow-up-right.js";
import Chart from "./lucide/icons/chart-no-axes-combined.js";
import Check from "./lucide/icons/check.js";
import ChevronRight from "./lucide/icons/chevron-right.js";
import CircleCheck from "./lucide/icons/circle-check.js";
import Clock from "./lucide/icons/clock-3.js";
import Copy from "./lucide/icons/copy.js";
import Database from "./lucide/icons/database.js";
import Download from "./lucide/icons/download.js";
import ExternalLink from "./lucide/icons/external-link.js";
import FileText from "./lucide/icons/file-text.js";
import Globe from "./lucide/icons/globe.js";
import Info from "./lucide/icons/info.js";
import LayoutDashboard from "./lucide/icons/layout-dashboard.js";
import Lightbulb from "./lucide/icons/lightbulb.js";
import ListFilter from "./lucide/icons/list-filter.js";
import LoaderCircle from "./lucide/icons/loader-circle.js";
import Menu from "./lucide/icons/menu.js";
import PackageSearch from "./lucide/icons/package-search.js";
import PlugZap from "./lucide/icons/plug-zap.js";
import Refresh from "./lucide/icons/refresh-cw.js";
import Rocket from "./lucide/icons/rocket.js";
import Search from "./lucide/icons/search.js";
import Settings from "./lucide/icons/settings-2.js";
import ShieldCheck from "./lucide/icons/shield-check.js";
import Target from "./lucide/icons/target.js";
import TriangleAlert from "./lucide/icons/triangle-alert.js";
import Users from "./lucide/icons/users.js";
import X from "./lucide/icons/x.js";

const icons = {
  "arrow-up-right": ArrowUpRight,
  "chart-no-axes-combined": Chart,
  check: Check,
  "chevron-right": ChevronRight,
  "circle-check": CircleCheck,
  "clock-3": Clock,
  copy: Copy,
  database: Database,
  download: Download,
  "external-link": ExternalLink,
  "file-text": FileText,
  globe: Globe,
  info: Info,
  "layout-dashboard": LayoutDashboard,
  lightbulb: Lightbulb,
  "list-filter": ListFilter,
  "loader-circle": LoaderCircle,
  menu: Menu,
  "package-search": PackageSearch,
  "plug-zap": PlugZap,
  "refresh-cw": Refresh,
  rocket: Rocket,
  search: Search,
  "settings-2": Settings,
  "shield-check": ShieldCheck,
  target: Target,
  "triangle-alert": TriangleAlert,
  users: Users,
  x: X,
};

export function renderIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((host) => {
    const node = icons[host.dataset.icon];
    if (!node) return;
    const svg = createElement(node, {
      width: host.dataset.size || 18,
      height: host.dataset.size || 18,
      "stroke-width": host.dataset.stroke || 2,
      "aria-hidden": "true",
    });
    host.replaceChildren(svg);
  });
}
