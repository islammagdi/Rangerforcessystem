import { RouterProvider } from "react-router";
import { router } from "./routes";
import { UnsavedChangesProvider } from "../lib/unsavedChanges";

export default function App() {
  return (
    // ✅ الـ Provider هنا فوق RouterProvider بالكامل، عشان يبقى
    // متاح لكل الصفحات (جوه Outlet) وللـ Sidebar/Breadcrumbs في
    // نفس الوقت من مكان واحد مركزي
    <UnsavedChangesProvider>
      <RouterProvider router={router} />
    </UnsavedChangesProvider>
  );
}