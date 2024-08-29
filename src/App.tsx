import './globalStyle.css';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { ReactRouter } from '@/routes';

function App() {

  return (
    <MantineProvider>
      <ReactRouter />
    </MantineProvider>
  );
}

export default App;
