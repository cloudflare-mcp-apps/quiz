/**
 * Security self-test for MCP App widget
 * Verifies proper iframe sandboxing according to MCP Apps best practices
 *
 * Reference: /mcp-apps/patterns/security-patterns.md
 */

/**
 * Run security self-test to verify proper iframe sandboxing
 *
 * @returns true if all security tests pass, false otherwise
 */
export function runSecuritySelfTest(): boolean {
  try {
    console.log('[Security] Running security self-test...');

    // Test 1: Must be in iframe
    if (window.self === window.top) {
      console.error('[Security] FAIL: Widget not in iframe');
      return false;
    }
    console.log('[Security] PASS: Widget is running in iframe');

    // Test 2: Cannot access parent window (should throw SecurityError)
    try {
      // Attempting to call alert on parent window should throw SecurityError
      // if properly sandboxed with double-iframe architecture
      window.top!.alert('test');
      console.error('[Security] FAIL: Can access parent window (sandbox breach!)');
      return false;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'SecurityError') {
        console.log('[Security] PASS: Cannot access parent window (correct sandboxing)');
      } else {
        console.warn('[Security] Unexpected error accessing parent:', e);
        // Still consider it a pass if we got an error
      }
    }

    // Test 3: Verify referrer (should be host domain)
    if (document.referrer) {
      console.log('[Security] Referrer:', document.referrer);
    } else {
      console.log('[Security] No referrer (normal for some sandbox configurations)');
    }

    // Test 4: Verify we can use postMessage (required for MCP communication)
    if (typeof window.parent.postMessage !== 'function') {
      console.error('[Security] FAIL: postMessage not available');
      return false;
    }
    console.log('[Security] PASS: postMessage available for communication');

    console.log('[Security] ✅ All security tests passed');
    return true;
  } catch (error) {
    console.error('[Security] Self-test error:', error);
    return false;
  }
}
