import CategoryPage from "@/components/category-page"
import { categoryConfigs } from "@/config/categories"

export default function PlushPage() {
  return <CategoryPage config={categoryConfigs.plush} />
}
