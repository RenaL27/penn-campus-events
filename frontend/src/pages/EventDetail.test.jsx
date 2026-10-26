import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import EventDetail from "./EventDetail";
import { api, isLoggedIn } from "../utils/api";
jest.mock("../utils/api", () => ({
  ...jest.requireActual("../utils/api"),
  api: jest.fn(),
  isLoggedIn: jest.fn(),
}));
test("registration refreshes attendance and offers a calendar link without a browser alert", async () => {
  localStorage.setItem("userId", "student");
  localStorage.setItem("token", "test-token");
  isLoggedIn.mockReturnValue(false);
  const event = {
    _id: "event-1",
    title: "Campus talk",
    date: "2027-01-01",
    time: "14:00",
    location: "Houston Hall",
    capacity: 10,
    attendees: [],
    waitlist: [],
    organizer: { _id: "host" },
  };
  api
    .mockResolvedValueOnce(event)
    .mockResolvedValueOnce({ message: "Registered for the event." })
    .mockResolvedValueOnce({ ...event, attendees: [{ _id: "student" }] });
  render(
    <MemoryRouter initialEntries={["/events/event-1"]}>
      <Routes>
        <Route path="/events/:id" element={<EventDetail />} />
      </Routes>
    </MemoryRouter>,
  );
  userEvent.click(await screen.findByRole("button", { name: "Register" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith("/events/event-1/rsvp", "POST"),
  );
  expect(
    await screen.findByRole("button", { name: "Unregister" }),
  ).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Registered for the event.",
  );
  expect(screen.getByRole("link", { name: /View calendar/ })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
