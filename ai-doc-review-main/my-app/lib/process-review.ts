export async function triggerReviewProcessing(sessionId: string) {
  try {
    const response = await fetch(`/api/reviews/${sessionId}/process`, {
      method: "POST",
    })

    if (!response.ok) {
      console.error("Failed to trigger review processing")
    }
  } catch (error) {
    console.error("Failed to trigger review processing:", error)
  }
}
