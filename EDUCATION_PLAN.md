# Orbital Learning Lab Plan

## Product structure

The application has three distinct jobs:

1. **Satellite Map** answers: What is happening now?
2. **Analysis** answers: What can the currently loaded configuration accomplish?
3. **Orbital Learning Lab** answers: Why does orbital geometry behave this way?

The learning lab should be organized around questions and observable outcomes rather than a form containing six unexplained orbital elements.

## Learning principles

- Begin each lesson with a physical question.
- Let the learner predict the result before changing an input.
- Compare a fixed baseline against one modified case.
- Connect every orbital input to ground tracks, access, coverage, timing, or line of sight.
- Change only one or two concepts per lesson.
- Label educational approximations and distinguish them from the live SGP4 analysis.

## Curriculum

### Module 1: Orbit size, tilt, and plane placement

**Question:** How do altitude, inclination, and RAAN change what a ground observer sees?

Inputs:

- Altitude
- Inclination
- RAAN
- Comparison period

Outputs:

- Baseline and modified ground tracks
- Orbital period
- Geometric horizon footprint
- Ground-station pass count
- Average pass duration
- Average revisit interval
- Longest access gap

### Module 2: Ground access geometry

**Question:** Why can a satellite be above the horizon but still fail an access requirement?

Inputs:

- Ground-station latitude and longitude
- Minimum elevation mask
- Satellite altitude

Outputs:

- Horizon geometry
- Slant range
- Access duration
- Maximum pass elevation
- Revisit interval

### Module 3: Earth occlusion and crosslinks

**Question:** When can two satellites see each other through space?

Inputs:

- Satellite separation
- Altitudes
- Same-plane or cross-plane geometry

Outputs:

- WGS-84 Earth-clear result
- Straight-line distance
- Closest approach to Earth
- Link start and end times

### Module 4: Eccentric orbits

**Question:** Why does a satellite move faster at perigee and remain longer near apogee?

Inputs:

- Eccentricity
- Argument of perigee
- Semi-major axis

Outputs:

- Perigee and apogee altitude
- Velocity variation
- Unequal ground-track timing
- Coverage and access asymmetry

### Module 5: Constellation revisit

**Question:** How do satellites, planes, and phasing reduce coverage gaps?

Inputs:

- Satellite count
- Plane count
- In-plane spacing
- RAAN spacing

Outputs:

- Pass timeline
- Average revisit
- Longest gap
- Simultaneous coverage
- Diminishing returns

## Technical roadmap

1. Keep educational propagation in `learning-lab.js` and operational analysis in `app.js`.
2. Replace the spherical two-body model with a reusable SGP4 hypothetical-orbit adapter when full six-element entry is added.
3. Add a map overlay mode for baseline and modified learning orbits.
4. Add lesson state to the URL so experiments can be shared.
5. Add local saved experiments without requiring accounts or a backend.
6. Add automated numerical checks for period, visibility, and revisit calculations.

## Current implementation

Lessons 1 and 2 use a two-body circular-orbit teaching model. Lesson 1 compares orbit size, tilt, and plane placement. Lesson 2 follows successive same-phase ground tracks to connect orbital period and Earth rotation to ground-track drift and ground-station revisit. Both intentionally emphasize intuition and remain clearly separated from the real-satellite SGP4 calculations used elsewhere in the application.
