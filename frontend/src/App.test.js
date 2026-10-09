import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Preferences from "./pages/Preferences";
import { api, isLoggedIn } from "./utils/api";
jest.mock("./utils/api", () => ({
  ...jest.requireActual("./utils/api"),
  api: jest.fn(),
  isLoggedIn: jest.fn(),
}));
const event = {
  _id: "event-1",
  title: "Campus Jazz",
  date: "2027-05-01",
  time: "18:00",
  location: "Houston Hall",
  category: "Arts & Media",
  eventType: "In-Person",
  attendanceCount: 5,
  organizer: { name: "Penn Music" },
  reasons: ["Matches your interests"],
  friendsGoing: [],
};
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  isLoggedIn.mockReturnValue(false);
  api.mockImplementation((path) => {
    if (path === "/users/me")
      return Promise.resolve({
        interests: ["Arts & Media"],
        interestsSet: true,
        searchHistory: [],
      });
    if (path === "/users/me/searches") return Promise.resolve([]);
    return Promise.resolve({ events: [event], total: 1, pages: 1 });
  });
});
test("recommended feed displays real API results and anonymous friends tab offers login", async () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
  expect(
    await screen.findByRole("link", { name: "View Campus Jazz" }),
  ).toBeInTheDocument();
  userEvent.click(screen.getByRole("tab", { name: "Friends Going" }));
  expect(
    await screen.findByRole("heading", { name: "Friends Going" }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("link", { name: "Log in" }).length,
  ).toBeGreaterThan(0);
});
test("filter draft waits for Apply, chips remove active filters, and reset clears them", async () => {
  render(
    <MemoryRouter initialEntries={["/events"]}>
      <Events />
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { name: /Upcoming events/ });
  userEvent.click(screen.getByRole("button", { name: "Filters" }));
  userEvent.click(screen.getByLabelText("Arts & Media"));
  expect(api.mock.calls.some(([path]) => path.includes("categories="))).toBe(
    false,
  );
  userEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await waitFor(() =>
    expect(
      api.mock.calls.some(([path]) =>
        path.includes("categories=Arts+%26+Media"),
      ),
    ).toBe(true),
  );
  userEvent.click(
    screen.getByRole("button", { name: "Remove Arts & Media filter" }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Remove Arts & Media filter" }),
    ).not.toBeInTheDocument(),
  );
  userEvent.click(screen.getByRole("button", { name: "Filters" }));
  userEvent.click(screen.getByLabelText("Online"));
  userEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  await screen.findByRole("button", { name: "Remove Online filter" });
  userEvent.click(screen.getByRole("button", { name: "Filters (1)" }));
  userEvent.click(screen.getByRole("button", { name: "Reset all" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Remove Online filter" }),
    ).not.toBeInTheDocument(),
  );
});
test("search saves only submitted terms and history can be cleared", async () => {
  render(
    <MemoryRouter initialEntries={["/events"]}>
      <Events />
    </MemoryRouter>,
  );
  await screen.findByText("No recent searches. Search by event title, topic, or organization.");
  userEvent.type(
    screen.getByRole("textbox", { name: "Search events" }),
    "Jazz",
  );
  expect(localStorage.getItem("penn-searches")).toBeNull();
  userEvent.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("heading", { name: /Results for “Jazz”/ });
  expect(JSON.parse(localStorage.getItem("penn-searches"))[0].query).toBe(
    "Jazz",
  );
  userEvent.clear(screen.getByRole("textbox", { name: "Search events" }));
  userEvent.click(screen.getByRole("button", { name: "Search" }));
  userEvent.click(await screen.findByRole("button", { name: "Clear" }));
  expect(localStorage.getItem("penn-searches")).toBeNull();
});
test("interests load, can be edited, and are saved through the API", async () => {
  isLoggedIn.mockReturnValue(true);
  render(
    <MemoryRouter>
      <Preferences />
    </MemoryRouter>,
  );
  const art = await screen.findByRole("checkbox", { name: /Arts & Media/ });
  expect(art).toBeChecked();
  userEvent.click(screen.getByRole("checkbox", { name: /Gaming & Tech/ }));
  userEvent.click(screen.getByRole("button", { name: "Save interests" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith("/users/me/interests", "PUT", {
      interests: ["Arts & Media", "Gaming & Tech"],
    }),
  );
  expect(
    await screen.findByText(/Your interests are saved/),
  ).toBeInTheDocument();
});
test("failed discovery requests show an error instead of a false empty state", async () => {
  api.mockRejectedValue(new Error("Cannot reach the server."));
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Cannot reach the server.",
  );
  expect(
    screen.queryByText("New plans are on the way"),
  ).not.toBeInTheDocument();
});
