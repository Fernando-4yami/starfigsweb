import CategoryPage from "@/components/category-page"
import { categoryConfigs } from "@/config/categories"

export default function PricingPage() {
  return <CategoryPage config={categoryConfigs.pricing} />
}
