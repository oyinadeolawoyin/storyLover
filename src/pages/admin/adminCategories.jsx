import AdminShell from '@/components/adminShell'
import CategoryManager from '@/components/categoryManager'
import { CategoryService } from '@/service/categoryService'

export default function AdminCategories() {
  return (
    <AdminShell title="Categories" subtitle="Reviews, Off the Page, Recommendations and more all live here.">
      <div className="max-w-2xl">
        <CategoryManager title="Post categories" service={CategoryService} />
      </div>
    </AdminShell>
  )
}