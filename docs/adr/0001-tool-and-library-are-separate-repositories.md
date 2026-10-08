# The tool and the library are separate repositories

im-ai (this repository) contains only the tool. Each person keeps their resources in their own library: a separate git repository that the tool points to through the machine config and creates with `im-ai init`. We chose this so that a second person can start their own library without forking the tool. During development, a small fixture library inside this repository stands in for a real one.

## Consequences

- Library metadata that belongs to the resources (origin of imported resources, intent notes) lives in one manifest file at the library root, not inside resource folders. Resource folders stay in the pure Agent Skills format.
- Machine-specific state (which projects hold which install) never goes into the library. See ADR-0002.
