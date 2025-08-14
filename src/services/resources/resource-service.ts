import { ResourceArgs, ResourceContent } from '../tools/tool-type';

class ResourceService {
    private resources: ResourceArgs[] = [];

    constructor() {
    }

    addResource(resource: ResourceArgs) {
        this.resources.push(resource);
    }

    addResources(resources: ResourceArgs[]) {
        this.resources.push(...resources);
    }

    getResourceNames(): string[] {
        return this.resources.map(resource => resource.name);
    }

    getResourceList(): ResourceArgs[] {
        return this.resources;
    }

    getResource(uri: string): ResourceArgs | undefined {
        return this.resources.find(resource => resource.uri === uri);
    }

    async getResourceContent(uri: string, args: object): Promise<ResourceContent | null> {
        const resource = this.getResource(uri);
        if (!resource) {
            return null;
        }
        return await resource.getContent(args);
    }
}

export default new ResourceService();

