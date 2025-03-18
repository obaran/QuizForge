import { createBrowserRouter } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import GeneratePage from './pages/GeneratePage';
import EditQuestionsPage from './pages/EditQuestionsPage';
import ExportPage from './pages/ExportPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <UploadPage />,
  },
  {
    path: '/generate/:docId',
    element: <GeneratePage />,
  },
  {
    path: '/edit/:docId',
    element: <EditQuestionsPage />,
  },
  {
    path: '/export/:docId',
    element: <ExportPage />,
  },
]);

export default router;
