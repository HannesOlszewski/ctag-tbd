import Navbar from "@/components/Navbar";
import { PropsWithChildren } from "react";

export default function Layout({
	name,
	children,
}: PropsWithChildren<{ name: string }>) {
	return (
		<>
			<Navbar title={name} />
			{children}
		</>
	);
}
