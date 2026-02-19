cmake_minimum_required(VERSION 3.22...3.31)
project(Vamos VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Fetch JUCE 8
include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG 8.0.6
    GIT_SHALLOW ON
)
FetchContent_MakeAvailable(JUCE)

juce_add_plugin(Vamos
    COMPANY_NAME "Vamos"
    PLUGIN_MANUFACTURER_CODE Vamo
    PLUGIN_CODE Vam0
    FORMATS Standalone VST3 AU
    PRODUCT_NAME "Vamos"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    COPY_PLUGIN_AFTER_BUILD TRUE
)

target_sources(Vamos PRIVATE
    src/PluginProcessor.cpp
    src/PluginEditor.cpp
    src/dsp/Oscillator.cpp
    src/dsp/Envelope.cpp
    src/dsp/Noise.cpp
    src/dsp/Mixer.cpp
    src/dsp/Filter.cpp
    src/dsp/LFO.cpp
    src/dsp/CyclingEnvelope.cpp
    src/dsp/Voice.cpp
    src/dsp/Synth.cpp
)

target_include_directories(Vamos PRIVATE src)

target_compile_definitions(Vamos PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_DISPLAY_SPLASH_SCREEN=0
)

target_link_libraries(Vamos
    PRIVATE
        juce::juce_audio_utils
        juce::juce_dsp
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# ─── Tests ────────────────────────────────────────────────────────────────────
option(VAMOS_BUILD_TESTS "Build Vamos test suite" ON)
if(VAMOS_BUILD_TESTS)
    add_subdirectory(tests)
endif()
