import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import WelcomePage from "./Welcome";

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

test("navigates to register pages separately", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<><WelcomePage /><LocationDisplay /></>} />
        <Route path="/register" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

  const registerLink = screen.getByTestId("register-link");
  expect(registerLink).toBeInTheDocument();
  await user.click(registerLink);
  expect(screen.getByTestId("location")).toHaveTextContent("/register");
  
});

test("navigates to login page", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<><WelcomePage /><LocationDisplay /></>} />
        <Route path="/login" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

  const loginLink = screen.getByTestId("login-link");
  expect(loginLink).toBeInTheDocument();
  await user.click(loginLink);
  expect(screen.getByTestId("location")).toHaveTextContent("/login");
});
