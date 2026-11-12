# ADR 0005: Simulated provider behind a port

`MobileMoneyProvider` is the only telecom boundary. `SimulatedMomoProvider` approves any 4-digit PIN except `0000` and `9999`. `RealMtnMomoProvider` implements the same interface and is not wired in. Swapping providers is a composition-root change. Business rules do not call MTN, Telecel, or AirtelTigo directly.
