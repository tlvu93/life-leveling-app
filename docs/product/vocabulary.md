# Product Vocabulary and Object Model

- **Status:** Canonical
- **Last updated:** 2026-08-15

The public vocabulary should be small enough to understand without a tutorial.
Game language is used only when it makes a relationship clearer.

## Core objects

### Universe

The shared, explorable world of Paths, reusable Nodes, and their relationships
— the Living Universe the person moves through. Formerly called the Atlas; the
implemented client and the v2 technical specs still use the `Atlas` identifier
in code and filenames, and may migrate lazily.

The Universe is stable enough that people can orient themselves while their
personal visibility and progress change.

The Universe is not a completeness score. Undiscovered territory does not imply a
deficit.

### Path

A recognizable direction someone may explore, such as DJ/VJ, sports
photography, game development, or furniture making.

A Path answers:

- What is this practice or direction?
- What can it look like in real life?
- What starting points and variants exist?
- Which Guides can help me navigate it?

A Path is not a single prescribed curriculum and does not label the Explorer's
identity.

### Node

A reusable concept in the Universe. Common Node types are:

- **Foundation:** background knowledge that supports several routes;
- **Skill:** a capability that can be practiced;
- **Experience:** exposure such as observing, interviewing, or attending;
- **Project:** something a person can make or do;
- **Milestone:** an observable outcome;
- **Resource:** a tool, place, community, or reference when it materially
  affects a route.

Nodes have stable identifiers. A Guide references shared Nodes instead of
copying them whenever their meaning is genuinely the same.

### Guide

A Creator's published or shared roadmap through a Path for a stated audience
and context. A Guide selects Nodes, connects them, assigns route roles, and
explains its reasoning.

Route roles are explicit:

- **Required:** genuinely necessary for the stated outcome;
- **Recommended:** useful in the author's route but not a hard gate;
- **Optional depth:** worthwhile for some people;
- **Alternative:** another way to reach a similar outcome;
- **Checkpoint:** a place to try, review, or demonstrate something.

A Guide may also record an explicit **excluded** stance, with a stated reason,
for a shared Node it deliberately does not place. Absence without a stance
carries no meaning.

A Guide is versioned advice, not canonical truth.

### Journey

The Explorer's personal roadmap (formerly called Build; the domain-model code
keeps the `Build` identifier for now). A Journey may begin as a copy of a Guide, a
combination of several Guides, or a route created from scratch.

The Explorer can reorder, remove, add, or reclassify Steps. The source Guide is
retained as provenance, but later Guide updates do not silently overwrite the
Journey.

### Step

A Node as it appears inside a Guide or Journey, including its route role,
position, notes, and any completion suggestion.

Not every Step is a task. A Step can be something to understand, observe,
practice, make, discuss, or demonstrate.

### Quest

An optional, bounded real-world action attached to a Step. A Quest helps an
Explorer sample or demonstrate something, but the product does not require
every Node to become a Quest.

Examples:

- map two visual changes to one song section;
- interview a practitioner about a working day;
- make a three-frame sports story;
- attend a local event and record private observations.

### Artifact

Optional evidence or memory attached to progress: a note, image, file, link,
recording, project, or external reference. Artifacts are private by default.

### Galaxy

A Creator- or organization-curated view of related Paths, Guides, and Nodes.
A Galaxy can have a distinct theme and presentation, but it is normally a
subgraph of the shared Universe rather than a disconnected copy of common
concepts.

Examples include an Audiovisual Performance Galaxy, a Local Maker Galaxy, or a
school's Creative Technology Galaxy.

## Supporting terms

### Explorer

A person discovering Paths or maintaining a personal Journey.

### Creator

A person structuring experience into a Guide or Galaxy. Creator status does
not automatically grant authority; context and evidence establish trust.

### Progress

The Explorer's relationship with a Step or Journey, recorded in language such as
interested, tried, practicing, demonstrated, paused, skipped, or not for me.

### History

The person's private record across Journeys (formerly called Journey). This is
useful internally but should not compete with Path, Guide, and Journey in
primary navigation.

## Relationship model

```text
Universe
  contains Paths and reusable Nodes

Path
  has official orientation and multiple Guides

Guide
  selects and connects shared Nodes

Explorer adopts or remixes Guide
  creating a personal Journey

Journey
  records progress and optional Artifacts per Step

Galaxy
  curates a shareable view across Paths, Guides, and Nodes
```

## New and duplicate Nodes

A Creator can use a provisional custom Node when the Universe does not contain the
needed concept. The Node remains scoped to that private or unlisted Guide until
a public proposal is reviewed.

Review may:

- connect the Guide to an existing Node;
- merge a duplicate while preserving the Creator's wording in the Guide;
- approve a new shared Node;
- request a narrower definition;
- reject unsafe, misleading, or non-distinct content.

## Language guardrails

These are bets tied to the product thesis, not permanent laws. They split into
commitments held until participant evidence says otherwise, and open framing
questions the prototype sessions will test (see decisions A-008 to A-010).

### Committed until evidence

Avoid these concepts in core product UI:

- calling, destiny, perfect match, or "meant for you";
- overdue, failed, fell behind, or get back on track;
- mandatory prerequisites when the relationship is only conventional advice;
- completion claims based only on opening content or checking a box;
- a life-completion percentage or any single score claiming to summarize a
  whole person.

Prefer:

- explore, compare, adopt, remix, try, practice, demonstrate, pause;
- one route, another route, recommended for, optional for;
- based on your selected interests, not a guaranteed fit;
- private unless you choose to share.

### Under test in the prototype

The mock explorations propose framings the original guardrails banned outright.
These are now open questions with session evidence as the referee:

- a per-Path "explored" figure (percentage versus practiced/demonstrated
  counts) — discovery framing may not carry the obligation weight the ban
  assumed (A-008);
- a playful level-like identity marker in the HUD — may read as identity or as
  pressure (A-009);
- Universe-wide tallies that enumerate untouched territory ("not started: N")
  — the standing bet is that this reads as a deficit, but it is a bet (A-010).

