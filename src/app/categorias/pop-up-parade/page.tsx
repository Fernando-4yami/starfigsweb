import CategoryPage from "@/components/category-page"
import { categoryConfigs } from "@/config/categories"

export default function PopUpParadePage() {
  return <CategoryPage config={categoryConfigs.popup} />
}
