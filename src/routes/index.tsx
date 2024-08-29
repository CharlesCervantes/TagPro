// import { createBrowserRouter, Outlet, RouterProvider, Navigate } from 'react-router-dom';
// import { Home } from '@/components/pages';

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <Outlet />,
//     errorElement: <p>Error 404</p>,
//     children: [
//       {
//         index: true, // Ruta por defecto
//         element: <Navigate to="/home/:uid" replace /> // Redirigir a /home
//       },
//       // {
//       //   path: 'home',
//       //   element: <Home />
//       // },
//       {
//         path: 'home/:uid',
//         element: <Home />
//       }
//     ]
//   }
// ]);

// export function ReactRouter() {
//   return (
//     <RouterProvider router={router} />
//   );
// }

import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { Home } from '@/components/pages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    children: [
      {
        path: 'home/:id',
        element: <Home />,
      }
    ]
  }
]);

export function ReactRouter() {
  return (
    <RouterProvider router={router} />
  );
}


