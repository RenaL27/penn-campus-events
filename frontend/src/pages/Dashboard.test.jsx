import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Dashboard, { weekDays } from "./Dashboard";
import { api, isLoggedIn } from "../utils/api";
jest.mock("../utils/api", () => ({
  ...jest.requireActual("../utils/api"),
  api: jest.fn(),
  isLoggedIn: jest.fn(),
}));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("userId", "student");
  isLoggedIn.mockReturnValue(false);
});
test("calendar week crosses month and year boundaries without shifting dates", () => {
  expect(weekDays("2027-01-01")).toEqual([
    "2026-12-27",
    "2026-12-28",
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
  ]);
});
test("calendar separates registrations from hosted events and shows waitlist status", async () => {
  const base = {
    date: "2027-01-01",
    time: "14:00",
    location: "Houston Hall",
    organizer: { _id: "host", name: "Penn Music" },
  };
  api.mockResolvedValue([
    { ...base, _id: "1", title: "Registered talk", attendees: ["student"] },
    {
      ...base,
      _id: "2",
      title: "Waitlisted talk",
      waitlist: [{ _id: "student" }],
    },
    {
      ...base,
      _id: "3",
      title: "Hosted workshop",
      organizer: { _id: "student" },
    },
    {
      ...base,
      _id: "4",
      title: "Someone else's event",
      attendees: ["someone"],
    },
  ]);
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Dashboard />
    </MemoryRouter>,
  );
  userEvent.click(screen.getByRole("button", { name: "All registrations" }));
  expect(
    await screen.findByRole("link", { name: "Registered talk" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Waitlisted")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Someone else's event" }),
  ).not.toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: "Hosting" }));
  expect(
    screen.getByRole("link", { name: "Hosted workshop" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Registered talk" }),
  ).not.toBeInTheDocument();
});
