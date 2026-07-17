# Check Implementations

Please take some time to review and check the implementations of recent major features.
Specifically:
- Check the `midi-layout.json` refactor implementation. Ensure that nested structure serialization/deserialization is bulletproof and handles edge cases properly in both the backend and `akvj` frontend.
- Check the custom element implementations for memory leaks, especially ensuring event listeners are properly cleaned up in `disconnectedCallback` or when elements are destroyed.
- Verify if any error handling or loading state feedback is missing in the new API endpoints or frontend fetch calls.
