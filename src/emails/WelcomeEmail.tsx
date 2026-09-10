import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    name?: string;
    loginUrl?: string;
}

export const WelcomeEmail = ({
    name = "User",
    loginUrl = "https://nocodepage.vercel.app/login",
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to NoCodePage - Let's build something amazing!</Preview>
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="mx-auto my-10 bg-white rounded-lg shadow-lg overflow-hidden max-w-[600px]">
                        {/* Header */}
                        <Section className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
                            <Img
                                src="https://i.ibb.co/jPzT7f0w/nocodepage-logo.png"
                                alt="NoCodePage"
                                height="50"
                                className="mx-auto"
                            />
                        </Section>

                        {/* Content */}
                        <Section className="p-8">
                            <Heading className="text-2xl font-bold text-gray-800 mb-4 text-center">
                                Welcome to NoCodePage, {name}! 🎉
                            </Heading>
                            <Text className="text-gray-600 text-base mb-6 leading-relaxed">
                                Thank you for joining us. We're excited to help you build professional websites in seconds using AI.
                                No coding required, just your imagination.
                            </Text>

                            <Section className="text-center mb-8">
                                <Button
                                    className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors"
                                    href={loginUrl}
                                >
                                    Start Building Now
                                </Button>
                            </Section>

                            <Text className="text-gray-600 text-sm mb-4">
                                Here's what you can do next:
                            </Text>
                            <ul className="list-disc list-inside text-gray-600 text-sm mb-8 pl-4">
                                <li className="mb-2">Create your first AI-generated website</li>
                                <li className="mb-2">Customize your design with our visual editor</li>
                                <li className="mb-2">Publish your site to the world</li>
                            </ul>

                            <Text className="text-gray-500 text-xs text-center border-t border-gray-200 pt-8">
                                If you have any questions, feel free to reply to this email or visit our{" "}
                                <Link href="https://nocodepage.tech/help" className="text-indigo-600 underline">
                                    Help Center
                                </Link>.
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="bg-gray-50 p-6 text-center border-t border-gray-200">
                            <Text className="text-gray-400 text-xs">
                                © 2024 NoCodePage. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;
