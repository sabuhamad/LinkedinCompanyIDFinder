"use client";
import { ProbatProviderClient, Experiment } from "@probat/react";
import OriginalComponent from "./idfinder.original";
import { idfinder as ExperimentVariant } from "./idfinder.experiment";

export default function idfinder(props) {
  return (
    <ProbatProviderClient userId="a016e79e-d87f-4fe5-8dd9-c9c26fd43fdd">
      <Experiment
        id="a9e77fa4-4af2-4e8a-b209-72545907e329"
        control={<OriginalComponent {...props} />}
        variants={{ experiment: <ExperimentVariant {...props} /> }}
      />
    </ProbatProviderClient>
  );
}
