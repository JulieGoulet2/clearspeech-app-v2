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

function mockOkResponse(payload: unknown = { valid: true }) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

function mockErrorResponse(status: number, detail: string) {
  return {
    ok: false,
    status,
    json: async () => ({ detail }),
    text: async () => JSON.stringify({ detail }),
  } as Response;
}

describe("Home page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
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

  test("user can switch to Spanish", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.selectOptions(screen.getByRole("combobox"), "es");

    expect(screen.getByRole("textbox", { name: "Tu mensaje" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Obtener una versión más clara" }),
    ).toBeInTheDocument();
  });

  test("team access code is validated before it is saved locally", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue(mockOkResponse());
    render(<Home />);

    await user.selectOptions(screen.getByRole("combobox"), "es");
    await user.type(
      screen.getByLabelText("Código de acceso del equipo"),
      "team-secret",
    );
    await user.click(screen.getByRole("button", { name: "Guardar código" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/validate-team-access`,
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(window.localStorage.getItem("clearspeech-team-access-code")).toBe("team-secret");
    expect(
      screen.getByText("El acceso del equipo está activo en este dispositivo."),
    ).toBeInTheDocument();
  });

  test("invalid team access code is not saved locally", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue(
      mockErrorResponse(401, "Invalid access code."),
    );
    render(<Home />);

    await user.selectOptions(screen.getByRole("combobox"), "es");
    await user.type(
      screen.getByLabelText("Código de acceso del equipo"),
      "wrong-code",
    );
    await user.click(screen.getByRole("button", { name: "Guardar código" }));

    expect(
      await screen.findByText("Este código de acceso no es válido."),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("clearspeech-team-access-code")).toBeNull();
    expect(
      screen.queryByText("El acceso del equipo está activo en este dispositivo."),
    ).not.toBeInTheDocument();
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
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
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
