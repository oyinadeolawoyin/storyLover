import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Layout from './components/layout'
import About from './pages/about'
import Articles from './pages/articles'
import Post from './pages/post'
import Recommendations from './pages/recommendations'
import NotFound from './pages/notFound'
import Login from './pages/admin/login'
import Admin from './pages/admin/admin'
import PostForm from './pages/admin/postForm'
import AdminRecommendations from './pages/admin/adminRecommendations'
import AdminCategories from './pages/admin/adminCategories'
import AdminSubscribers from './pages/admin/adminSubscribers'
import AdminRoute from './components/adminRoutes'
import StoryChecker from './pages/storyChecker'

const router = createBrowserRouter([
  // Public site: every page here gets the header and footer
  {
    element: <Layout />,
    children: [
      { path: '/', element: <App /> },
      { path: '/articles', element: <Articles /> },
      // Reviews, Off the Page and every other category use the same page
      { path: '/category/:slug', element: <Articles /> },
      { path: '/posts/:slug', element: <Post /> },
      { path: '/recommendations', element: <Recommendations /> },
      { path: '/about', element: <About /> },
      { path: '/story-clarity-checker', element: <StoryChecker /> },
      // Anything that does not match above
      { path: '*', element: <NotFound /> },
    ],
  },

  // Admin: no blog layout
  { path: '/admin/login', element: <Login /> },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <Admin />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/posts/new',
    element: (
      <AdminRoute>
        <PostForm />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/posts/:id/edit',
    element: (
      <AdminRoute>
        <PostForm />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/recommendations',
    element: (
      <AdminRoute>
        <AdminRecommendations />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/categories',
    element: (
      <AdminRoute>
        <AdminCategories />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/subscribers',
    element: (
      <AdminRoute>
        <AdminSubscribers />
      </AdminRoute>
    ),
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)