## MODIFIED Requirements

### Requirement: Active-round fruit effect
When a cinema logo activation occurs during an unrevealed round with at least
one participant who has not voted, the application SHALL select one random fruit
emoji and one not-yet-voted participant and SHALL display the same selection to
every connected client in the session. Each client SHALL animate the fruit from
its in-room cinema logo to that selected participant. Each received fruit effect
SHALL complete independently without replacing another active fruit effect.

#### Scenario: Fruit targets an eligible participant
- **WHEN** a participant activates the cinema logo during an unrevealed round with not-yet-voted participants
- **THEN** every connected client displays the selected fruit flying from its in-room cinema logo to the same eligible participant

#### Scenario: Fruit impact completes
- **WHEN** the fruit reaches its selected participant
- **THEN** the client briefly displays an explosion at that participant and then removes the fruit effect without changing the round or votes

#### Scenario: Rapid activations create concurrent effects
- **WHEN** participants activate the cinema logo again before an active fruit effect completes
- **THEN** every received fruit continues with its own fruit, target, and explosion lifecycle without replacing an existing effect

#### Scenario: No participant is eligible
- **WHEN** a participant activates the cinema logo during an unrevealed round where every participant has voted
- **THEN** the logo activation is displayed without a fruit effect

#### Scenario: Round is revealed or absent
- **WHEN** a participant activates the cinema logo while there is no unrevealed round
- **THEN** the logo activation is displayed without a fruit effect
