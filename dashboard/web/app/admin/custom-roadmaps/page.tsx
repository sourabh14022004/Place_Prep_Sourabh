import RoadmapList from "@/components/staff/custom-roadmaps/RoadmapList";

export const metadata = { title: "Custom Roadmaps" };

export default function Page() {
  return <RoadmapList basePath="/admin" />;
}
