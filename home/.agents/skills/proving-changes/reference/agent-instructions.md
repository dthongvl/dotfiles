# Proving a change to agent instructions

Agent instructions are text that a model reads to decide how to act: system prompts, AGENTS.md and other guidance files, skills, tool and parameter descriptions, and prompt templates. Reading the new text proves nothing about behavior. The proof is what fresh agents do with it: an eval, which runs fresh agents on realistic requests and counts how often they behave as intended.

## Plan the eval

- **Target behavior**: one sentence naming what agents must now do, for example "uses the credits plugin whenever a user asks to grant credits".
- **Cases that should trigger it**: three to five realistic requests that should trigger the behavior, phrased the way users actually ask. Do not name the tool, file, or rule in the request; a request that names it tests reading, not the instruction.
- **Cases that must not trigger it**: one or two nearby requests where the behavior must not happen, to catch an instruction that now fires too often.
- **Runs**: at least three fresh agents per case, for both the old text and the new text, with the real system prompt, tools, and repository.

Running many agents costs time and money. When the user asked for proof, run the eval. Otherwise, propose it with its size and wait for approval.

## Run it

1. Start each run in a fresh agent: a new thread, sandbox, or subagent that has not seen this conversation or the reason for the change.
2. Make sure each run loads the version under test. Reload or restart anything that caches instructions, such as skill lists, plugin processes, or a long-running session.
3. Send the case's request unchanged, and let the agent work as it normally would.
4. Judge each run by what the agent did, such as which tools it called, with which arguments, and which files it read, not by its final summary.
5. Archive or delete the eval runs when you are done.

## Report it

- One list item per case with the pass counts for the old and new text, such as 1 of 5 before and 5 of 5 after.
- For each failing run, the step where the agent went wrong, quoted from its transcript.
- What the eval does not cover, such as other models, modes, or request phrasings.

When the new text fails a case, change the text and rerun the same cases. Do not change the cases to fit the text.
