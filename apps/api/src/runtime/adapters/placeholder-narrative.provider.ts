import { Injectable } from '@nestjs/common';
import { PlaceholderNarrativeProvider as RuntimePlaceholderNarrativeProvider } from '@tmb/runtime';

@Injectable()
export class PlaceholderNarrativeProvider extends RuntimePlaceholderNarrativeProvider {}
