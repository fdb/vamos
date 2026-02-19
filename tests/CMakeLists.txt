# Fetch Catch2 v3
include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.5.2
    GIT_SHALLOW ON
)
FetchContent_MakeAvailable(Catch2)

# ─── DSP unit tests (no JUCE dependency, fast) ───────────────────────────────

add_executable(VamosTests
    TestMain.cpp
    dsp/OscillatorTests.cpp
    dsp/EnvelopeTests.cpp
    dsp/FilterTests.cpp
    dsp/VoiceTests.cpp
    dsp/SynthTests.cpp
    # DSP sources under test
    ${CMAKE_SOURCE_DIR}/src/dsp/Oscillator.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Envelope.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Noise.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Mixer.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Filter.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/LFO.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/CyclingEnvelope.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Voice.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Synth.cpp
)

target_include_directories(VamosTests PRIVATE ${CMAKE_SOURCE_DIR}/src)
target_link_libraries(VamosTests PRIVATE Catch2::Catch2WithMain)
target_compile_features(VamosTests PRIVATE cxx_std_20)

# ─── Plugin smoke tests (links JUCE) ─────────────────────────────────────────

add_executable(VamosPluginTests
    TestMain.cpp
    plugin/PluginTests.cpp
    # Need all sources since PluginProcessor uses the DSP engine
    ${CMAKE_SOURCE_DIR}/src/PluginProcessor.cpp
    ${CMAKE_SOURCE_DIR}/src/PluginEditor.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Oscillator.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Envelope.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Noise.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Mixer.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Filter.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/LFO.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/CyclingEnvelope.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Voice.cpp
    ${CMAKE_SOURCE_DIR}/src/dsp/Synth.cpp
)

target_include_directories(VamosPluginTests PRIVATE ${CMAKE_SOURCE_DIR}/src)
target_link_libraries(VamosPluginTests
    PRIVATE
        Catch2::Catch2WithMain
        juce::juce_audio_utils
        juce::juce_dsp
)
target_compile_features(VamosPluginTests PRIVATE cxx_std_20)

# JUCE requires these definitions
target_compile_definitions(VamosPluginTests PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_DISPLAY_SPLASH_SCREEN=0
    JUCE_STANDALONE_APPLICATION=0
    JUCE_USE_CUSTOM_PLUGIN_STANDALONE_APP=0
)

# Register with CTest
list(APPEND CMAKE_MODULE_PATH ${catch2_SOURCE_DIR}/extras)
include(CTest)
include(Catch)
catch_discover_tests(VamosTests)
catch_discover_tests(VamosPluginTests)
