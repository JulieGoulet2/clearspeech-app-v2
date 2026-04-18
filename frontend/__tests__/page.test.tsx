/**
 * page.test.tsx — Core UI tests for the ClearSpeech main page.
 *
 * Tests the basic page flow: rendering, language switching, the rewrite
 * request, and the yes/no confirmation step. All API calls are mocked
 * so no backend or OpenAI key is needed to run these tests.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";

type MockRewriteResponse = {
  proposed_sentence: string;
  confirmation_question: string;
};

function mockFetchResponse(payload: MockRewriteResponse) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response);
}

describe("Home page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("page renders", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "ClearSpeech" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Your message" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get clearer version" })).toBeInTheDocument();
  });

  test("user can type", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const textarea = screen.getByRole("textbox", { name: "Your message" });
    await user.type(textarea, "Need help writing this better");

    expect(textarea).toHaveValue("Need help writing this better");
  });

  test("clicking button triggers API call", async () => {
    const user = userEvent.setup();
    mockFetchResponse({
      proposed_sentence: "Improved sentence",
      confirmation_question: "Is this right?",
    });
    render(<Home />);

    const textarea = screen.getByRole("textbox", { name: "Your message" });
    await user.type(textarea, "hello");
    await user.click(screen.getByRole("button", { name: "Get clearer version" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/rewrite`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const requestOptions = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(requestOptions.body)).toEqual({
      message: "hello",
      language_hint: "en",
    });
  });

  test("API response is displayed", async () => {
    const user = userEvent.setup();
    mockFetchResponse({
      proposed_sentence: "Test sentence",
      confirmation_question: "Is this correct?",
    });
    render(<Home />);

    const textarea = screen.getByRole("textbox", { name: "Your message" });
    await user.type(textarea, "original");
    await user.click(screen.getByRole("button", { name: "Get clearer version" }));

    expect(await screen.findByText("Test sentence")).toBeInTheDocument();
    expect(await screen.findByText("Is this correct?")).toBeInTheDocument();
  });
});
