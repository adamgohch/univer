# Zorel spreadsheet adaptation

An actual Univer 1.1.0 workbook embedded in an existing host application's feasibility pane. This is the adaptation source on adamgohch/univer, branch codex/zorel-integration. No upstream engine files are modified. The application currently consumes the pinned published Univer packages; this folder contains the custom bridge, workbook mapping, review controls and build recipe.

## Build

From this directory, run npm ci, npm test, then npm run build. Copy the contents of dist/ into the host application's static root. No API keys, remote services or paid inference are needed. The engine is Apache-2.0; retain the repository license and emitted legal notices. Commercial Univer Pro modules are not included.

## Host integration contract

Render an iframe with data-zorel-univer and a meaningful title in the existing workspace pane. Import mountUniverInScheme from /univer-host.js and call it after rendering with the containing DOM node and these synchronous hooks:

- snapshot(): return the current scheme snapshot described below.
- select(key): carry the selected row into the existing assistant selection context, without re-rendering the iframe.
- preview(change): validate version and editable input, calculate a copy of the scheme, and return a snapshot with preview: true and proposed row values. Do not save or mutate the current scheme.
- accept(change): validate again, then invoke the host's existing mutation, undo, history and persistence path. Re-render with the newly saved snapshot.
- reject(): return the unchanged current snapshot.

Each change contains key, numeric value and version. Use validateUniverChange(rows, change) and assertUniverRevision(change.version, currentVersion) before both preview and accept. The version must include the scheme identity and all calculation inputs; reject stale versions. Never accept calculated or externally linked inputs.

Snapshot fields: name (display text), version (opaque string), preview (boolean), rows (array), monthly ({months, rows:[{label, values: number[]}]}). Each row contains id, label, value, optional proposed, unit, money, formula (source explanation), editable, min, max, step. Geometry and detailed finance remain authoritative in the host. The workbook maps simple totals, profit and margins to actual cell formulas; the host must supply the corresponding standard row IDs and calculation definitions from univer-model.js. Other values are provided by the host calculation engine.

The iframe bridge verifies origin, source window and a per-frame token. Its content security policy disables network connections. The workbook is read-only for inspection and selection. Changes are proposed through the input controls, then accepted or rejected. Editing an input after preview invalidates acceptance until it is previewed again.

## Current scope

Two real sheets: Feasibility and Monthly cash flow. Current and proposed values appear side by side on Feasibility. Monthly cash flow is labelled current scheme and refreshes after acceptance. Preview state is temporary and discarded when the parent re-renders or navigation leaves the pane. The host owns saved figures and undo; the workbook is reconstructed from them. Generic Excel import/export, arbitrary cell editing, collaboration and a live LLM are not implemented here. No sample project data, credentials, private application source or user files are included.

## Validation

Unit tests cover invalid/locked inputs, stale versions and separate current/proposed formula references. The Zorel host integration was additionally exercised in a browser against a separate copy of its saved workspace: preview, acceptance, rejection, selection, undo and persistence. Host application tests remain separate from this public adapter.
