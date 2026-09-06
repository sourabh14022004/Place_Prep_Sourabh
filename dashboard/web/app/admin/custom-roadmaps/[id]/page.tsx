import RoadmapBuilder from "@/components/staff/custom-roadmaps/RoadmapBuilder";

export const metadata = { title: "Edit Custom Roadmap" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoadmapBuilder basePath="/admin" roadmapId={id} />;
}
