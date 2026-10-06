import AdminShell from '@/components/adminShell'
import CategoryManager from '@/components/categoryManager'
import { CategoryService } from '@/service/categoryService'
import { RecommendationCategoryService } from '@/service/recommendationCategoryService'

export default function AdminCategories() {
  return (
    <AdminShell title="Categories" subtitle="Keep your posts and recommendations organised.">
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryManager title="Post categories" service={CategoryService} />
        <CategoryManager title="Recommendation categories" service={RecommendationCategoryService} />
      </div>
    </AdminShell>
  )
}