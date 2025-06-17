/* import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('render Hello world', () => {
  render(<App />);
  expect(screen.getByText(/hello world/i)).toBeInTheDocument();
});

test('Increases the counter on click', async () => {
  render(<App />);
  const button = screen.getByRole('button', { name: /count is/i });
  await userEvent.click(button);
  expect(button).toHaveTextContent('count is 1');
});
 */