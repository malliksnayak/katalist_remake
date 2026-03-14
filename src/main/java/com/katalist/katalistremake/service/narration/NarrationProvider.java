package com.katalist.katalistremake.service.narration;

public interface NarrationProvider {
    /**
     * Generates audio from text and returns it as a byte array (e.g., WAV data).
     *
     * @param text  The text to convert to speech.
     * @param voice The identifier for the voice to be used.
     * @return A byte array containing the audio data.
     */
    byte[] generateAudio(String text, String voice);

    /**
     * Gets the name of the current provider.
     *
     * @return The provider name.
     */
    String getProviderName();
}
