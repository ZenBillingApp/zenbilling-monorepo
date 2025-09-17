import { jest } from "@jest/globals";

// Mock d'axios
export const mockAxios = {
    post: jest.fn() as jest.MockedFunction<any>,
    get: jest.fn() as jest.MockedFunction<any>,
    put: jest.fn() as jest.MockedFunction<any>,
    delete: jest.fn() as jest.MockedFunction<any>,
};

jest.mock("axios", () => ({
    default: mockAxios,
    post: mockAxios.post,
    get: mockAxios.get,
    put: mockAxios.put,
    delete: mockAxios.delete,
}));

export default mockAxios;
